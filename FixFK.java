import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class FixFK {
    public static void main(String[] args) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        Connection conn = DriverManager.getConnection(
                "jdbc:mysql://127.0.0.1:3307/piece?serverTimezone=UTC", "root", "");
        Statement stmt = conn.createStatement();

        // Show existing FKs on commandes_lignes
        ResultSet rs = stmt.executeQuery(
                "SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE " +
                        "WHERE TABLE_SCHEMA='piece' AND TABLE_NAME='commandes_lignes' AND REFERENCED_TABLE_NAME IS NOT NULL");
        System.out.println("=== Existing FKs on commandes_lignes ===");
        while (rs.next()) {
            System.out.println(rs.getString("CONSTRAINT_NAME") + " -> " + rs.getString("REFERENCED_TABLE_NAME"));
        }

        // Drop the bad FK pointing to wrong table
        try {
            stmt.execute("ALTER TABLE commandes_lignes DROP FOREIGN KEY FKqg2yhwmbpso6g5991ljrnwbgw");
            System.out.println("Dropped FK FKqg2yhwmbpso6g5991ljrnwbgw");
        } catch (Exception e) {
            System.out.println("FK drop result: " + e.getMessage());
        }

        // Add correct FK pointing to commandes
        try {
            stmt.execute("ALTER TABLE commandes_lignes ADD CONSTRAINT fk_commandes_lignes_commande " +
                    "FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE");
            System.out.println("Added correct FK -> commandes");
        } catch (Exception e) {
            System.out.println("FK add result: " + e.getMessage());
        }

        // Also check/rename commandes_fournisseurs -> commandes if needed
        try {
            ResultSet tables = stmt.executeQuery(
                    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='piece' AND TABLE_NAME='commandes_fournisseurs'");
            if (tables.next()) {
                System.out.println(
                        "Table commandes_fournisseurs still exists. No action needed (JPA will use commandes).");
            } else {
                System.out.println("Table commandes_fournisseurs does not exist.");
            }
        } catch (Exception e) {
            System.out.println("Check error: " + e.getMessage());
        }

        stmt.close();
        conn.close();
        System.out.println("Done.");
    }
}
