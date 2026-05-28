package hospital.management.system;


import net.proteanit.sql.DbUtils;

import javax.swing.*;
import javax.swing.table.TableModel;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.sql.ResultSet;


public class Room extends JFrame {
    JTable table;

    Room() {


        JPanel panel = new JPanel();
        panel.setBounds(5, 5, 840, 540);
        panel.setBackground(new Color(90, 156, 163));
        panel.setLayout(null);
        add(panel);

        try {
            java.net.URL imgURL = ClassLoader.getSystemResource("icon/roomm.png");
            if (imgURL != null) {
                ImageIcon imageIcon = new ImageIcon(imgURL);
                Image image = imageIcon.getImage().getScaledInstance(200,200,Image.SCALE_SMOOTH);
                ImageIcon imageIcon1 = new ImageIcon(image);
                JLabel Label = new JLabel(imageIcon1);
                Label.setBounds(550,150,200,200);
                panel.add(Label);
            }
        } catch (Exception e) {
            System.out.println("Icon not found: icon/roomm.png");
        }
        table = new JTable();
        table.setBounds(10, 40, 540, 400);
        table.setBackground(new Color(90, 156, 163));
        panel.add(table);


        try{
            connection con = new connection();
            String q = "select * from room";
            ResultSet resultset = con.statement.executeQuery(q);
            table.setModel(DbUtils.resultSetToTableModel(resultset));

        }catch(Exception e){
            e.printStackTrace();
        }

        JLabel label1 = new JLabel("Room No");
        label1.setBounds(12, 15, 80, 15);
        label1.setFont(new Font("Tahoma", Font.BOLD, 14));
        panel.add(label1);


        JLabel label2 = new JLabel("Availability");
        label2.setBounds(140, 15, 80, 15);
        label2.setFont(new Font("Tahoma", Font.BOLD, 14));
        panel.add(label2);

        JLabel label3= new JLabel("price");
        label3.setBounds(290, 15, 80, 15);
        label3.setFont(new Font("Tahoma", Font.BOLD, 14));
        panel.add(label3);


        JLabel label4= new JLabel("Bed Type");
        label4.setBounds(400, 15, 80, 15);
        label4.setFont(new Font("Tahoma", Font.BOLD, 14));
        panel.add(label4);


        JButton Back= new JButton("Back");
        Back.setBounds(200,500,120,30);
        Back.setBackground(Color.BLACK);
        Back.setForeground(Color.WHITE);
        panel.add(Back);
        Back.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                setVisible(false);

            }
        });


        setUndecorated(true);
        setSize(900, 600);
        setLayout(null);
        setLocation(300, 230);
        setVisible(true);
    }

    public static void main(String[] args) {
        new Room();
    }
}


